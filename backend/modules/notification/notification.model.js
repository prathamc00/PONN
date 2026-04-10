module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
            defaultValue: 'info'
        },
        link: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
        // userId handled by associations defined as 'user' in index.js
    }, {
        timestamps: true
    });

    return Notification;
};
