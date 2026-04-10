module.exports = (sequelize, DataTypes) => {
    const CourseProgress = sequelize.define('CourseProgress', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        completedModules: {
            type: DataTypes.JSON, // Stores array of module IDs (which are now string/UUID)
            defaultValue: []
        }
        // student and course are handled via associations
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['student', 'course']
            }
        ]
    });

    return CourseProgress;
};
