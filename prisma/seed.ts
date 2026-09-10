import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_DESTINATIONS } from '../src/lib/seedData'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding VoyageCraft database...')

  // Seed default admin user if not existing
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@voyagecraft.com' },
    update: {},
    create: {
      name: 'VoyageCraft Admin',
      email: 'admin@voyagecraft.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      travelPreferences: 'Luxury Travel, Cultural Heritage, Photography',
    },
  })
  console.log('Admin user ready:', admin.email)

  // Seed default user
  const userPasswordHash = await bcrypt.hash('user1234', 10)
  const sampleUser = await prisma.user.upsert({
    where: { email: 'traveler@voyagecraft.com' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'traveler@voyagecraft.com',
      passwordHash: userPasswordHash,
      role: 'USER',
      travelPreferences: 'Backpacking, Nature, Street Food',
    },
  })
  console.log('Sample user ready:', sampleUser.email)

  // Seed destinations and attractions
  for (const destData of DEFAULT_DESTINATIONS) {
    const existing = await prisma.destination.findFirst({
      where: { name: destData.name },
    })

    if (!existing) {
      const dest = await prisma.destination.create({
        data: {
          name: destData.name,
          country: destData.country,
          description: destData.description,
          image: destData.image,
          location: destData.location,
          popular: destData.popular,
          attractions: {
            create: destData.attractions,
          },
        },
      })
      console.log(`Created destination: ${dest.name}`)
    }
  }

  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
