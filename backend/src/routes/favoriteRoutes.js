const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth')
const User = require('../models/User')

// Get user's favorite vets
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favoriteVets', 
      'name email avatar specialization rating experience bio languages'
    )
    
    res.json({
      success: true,
      data: user.favoriteVets || []
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
    
    if (user.favoriteVets.includes(vetId)) {
      return res.status(400).json({
        success: false,
        error: 'Vet already in favorites'
      })
    }

    user.favoriteVets.push(vetId)
    await user.save()

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
