export const getCurrentUser = async (req, res) => {
    try {
        res.status(200).json({
            user: req.user
        })
    } catch (error) {
        console.error('[Get Current User Error]', error)

        res.status(500).json({
            message: 'Server error while getting user profile'
        })
    }
}