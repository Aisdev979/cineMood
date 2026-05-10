export const protect = async (req, res, next) => {
    try {
        let token;

        console.log("Cookies in request:", req.cookie);

        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        console.log("Token from cookies:", token);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "You are not logged in"
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};


export const isAuthorized = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to access this resource"
                });
            }
            
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to access this resource"
                });
            }

            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action"
            });
        }
    };
};
