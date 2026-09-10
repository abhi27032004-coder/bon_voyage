import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const body = await req.json()
    const { category, amount, date, description, receiptLink } = body

    if (!category || amount === undefined) {
      return NextResponse.json({ error: 'Category and amount are required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json({ error: 'Expense amount must be zero or a positive number' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        budget: true,
        members: true,
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const isMember = trip.members.some((m) => m.userId === auth.user.id)
    if (!isMember && trip.ownerId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to add expenses to this trip' }, { status: 403 })
    }

    let budget = trip.budget
    if (!budget) {
      budget = await prisma.budget.create({
        data: {
          tripId,
          totalAmount: 1000.0,
          currency: 'USD',
        },
      })
    }

    const expense = await prisma.expense.create({
      data: {
        tripId,
        budgetId: budget.id,
        payerId: auth.user.id,
        category,
        amount: numAmount,
        date: date ? new Date(date) : new Date(),
        description: description || '',
        receiptLink: receiptLink || '',
      },
    })

    await checkAndTriggerBudgetAlerts(tripId, budget)

    return NextResponse.json({ message: 'Expense added successfully', expense }, { status: 201 })
  } catch (error: any) {
    console.error('Add expense error:', error)
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const body = await req.json()
    const { expenseId, category, amount, date, description, receiptLink } = body

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 })
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
      return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 })
    }

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { budget: true },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(category ? { category } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(receiptLink !== undefined ? { receiptLink } : {}),
      },
    })

    if (existingExpense.budget) {
      await checkAndTriggerBudgetAlerts(tripId, existingExpense.budget)
    }

    return NextResponse.json({ message: 'Expense updated successfully', expense: updatedExpense })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const expenseId = searchParams.get('expenseId')

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 })
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

async function checkAndTriggerBudgetAlerts(tripId: string, budget: any) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { tripId },
    })

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalBudget = Number(budget.totalAmount)

    if (totalBudget <= 0) return

    const ratio = totalSpent / totalBudget

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    })

    if (!trip) return

    const recipients = new Set<string>([trip.ownerId, ...trip.members.map((m) => m.userId)])

    if (ratio >= 0.8 && ratio < 1.0 && !budget.alert80Sent) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { alert80Sent: true },
      })

      for (const recipientId of recipients) {
        await prisma.notification.create({
          data: {
            recipientId,
            message: `⚠️ Budget Warning: "${trip.name}" has reached 80% of its budget limit ($${totalSpent.toFixed(2)} / $${totalBudget.toFixed(2)}).`,
            type: 'BUDGET_ALERT_80',
          },
        })
      }
    }

    if (ratio >= 1.0 && !budget.alert100Sent) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { alert100Sent: true },
      })

      for (const recipientId of recipients) {
        await prisma.notification.create({
          data: {
            recipientId,
            message: `🚨 Budget Exceeded: "${trip.name}" has reached or exceeded 100% of its total budget ($${totalSpent.toFixed(2)} / $${totalBudget.toFixed(2)}).`,
            type: 'BUDGET_ALERT_100',
          },
        })
      }
    }
  } catch (err) {
    console.error('Error triggering budget alerts:', err)
  }
}
