const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            })
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to access this resource'
            })
        }

        next()
    }
}

export default requireRole