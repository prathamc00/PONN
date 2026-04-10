module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define('Attendance', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        activityType: {
            type: DataTypes.ENUM('login', 'video_watch', 'material_access', 'module_complete'),
            allowNull: false
        },
        details: {
            type: DataTypes.STRING,
            allowNull: true
        }
        // student and course are defined in associations
    }, {
        timestamps: true
    });

    return Attendance;
};
