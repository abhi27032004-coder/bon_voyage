export interface PlaceSearchResult {
  name: string
  country: string
  description: string
  image: string
  location: string
  lat?: number
  lng?: number
}

export async function searchPlacesServerSide(query: string): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (apiKey && query.trim()) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=${apiKey}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.results && Array.isArray(data.results)) {
          return data.results.slice(0, 6).map((item: any) => ({
            name: item.name,
            country: item.formatted_address?.split(',').pop()?.trim() || 'Global',
            description: item.formatted_address || `Explore ${item.name}`,
            image: item.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${item.photos[0].photo_reference}&key=${apiKey}`
              : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
            location: item.formatted_address || item.name,
            lat: item.geometry?.location?.lat,
            lng: item.geometry?.location?.lng,
          }))
        }
      }
    } catch (e) {
      console.warn('Google Places API search error, falling back:', e)
    }
  }

  // Fallback / OpenStreetMap search simulation when API key is unconfigured
  return [
    {
      name: query,
      country: 'Popular Destination',
      description: `Discover top highlights, dining, and scenic spots in ${query}.`,
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
      location: `${query}`,
      lat: 48.8566,
      lng: 2.3522,
    }
  ]
}
