const MAX_OTP_ATTEMPTS = 5;

module.exports = (sequelize, DataTypes) => {
    const Otp = sequelize.define('Otp', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                isEmail: true
            }
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        expiresAt: {
            type: DataTypes.DATE,
            defaultValue: () => new Date(Date.now() + 300000) // 5 minutes
        }
    }, {
        timestamps: true
    });

    Otp.MAX_OTP_ATTEMPTS = MAX_OTP_ATTEMPTS;

    return Otp;
};
