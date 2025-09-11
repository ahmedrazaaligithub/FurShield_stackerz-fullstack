const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth')
const User = require('../models/User')

// Get user's favorite vets
router.get('/', protect, async (req, res) => {
  try {
    // First get user with favoriteVets array
    const user = await User.findById(req.user.id)
    
    if (!user || !user.favoriteVets || user.favoriteVets.length === 0) {
      console.log('No favorites found for user')
      return res.json({
        success: true,
        data: {
          data: []
        }
      })
    }
    
    // Then populate the favoriteVets
    await user.populate({
      path: 'favoriteVets',
      select: 'name email avatar specialization rating experience bio languages profile role'
    })
    
    console.log('User ID:', req.user.id)
    console.log('Raw user favorites:', user.favoriteVets)
    console.log('Favorites count:', user.favoriteVets ? user.favoriteVets.length : 0)
    
    // Filter out any null values from population
    const validFavorites = user.favoriteVets ? user.favoriteVets.filter(vet => vet !== null) : []
    
    console.log('Valid favorites after filtering:', validFavorites)
    
    res.json({
      success: true,
      data: {
        data: validFavorites
      }
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    })
  }
})

// Add vet to favorites
router.post('/', protect, async (req, res) => {
  try {
    const { vetId } = req.body
    
    if (!vetId) {
      return res.status(400).json({
        success: false,
        error: 'Vet ID is required'
      })
    }

    const user = await User.findById(req.user.id)
    console.log('Current user favorites:', user.favoriteVets)
    console.log('Adding vet ID:', vetId)
    
    // Check if already exists using string comparison
    const isAlreadyFavorite = user.favoriteVets.some(fav => fav.toString() === vetId.toString())
    
    if (isAlreadyFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Vet already in favorites'
      })
    }

    user.favoriteVets.push(vetId)
    await user.save()
    
    console.log('Updated user favorites:', user.favoriteVets)

    res.json({
      success: true,
      message: 'Added to favorites'
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add to favorites'
    })
  }
})

// Remove vet from favorites
router.delete('/:vetId', protect, async (req, res) => {
  try {
    const { vetId } = req.params
    
    const user = await User.findById(req.user.id)
    user.favoriteVets = user.favoriteVets.filter(id => id.toString() !== vetId)
    await user.save()

    res.json({
      success: true,
      message: 'Removed from favorites'
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove from favorites'
    })
  }
})

module.exports = router
