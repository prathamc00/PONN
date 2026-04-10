module.exports = (sequelize, DataTypes) => {
    const Test = sequelize.define('Test', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Test title is required' }
            }
        },
        questions: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        totalQuestions: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 }
        },
        durationMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 }
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('upcoming', 'active', 'completed'),
            defaultValue: 'upcoming'
        }
        // course and createdBy handled by associations
    }, {
        timestamps: true
    });

    return Test;
};
