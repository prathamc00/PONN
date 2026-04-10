module.exports = (sequelize, DataTypes) => {
    const QuizAttempt = sequelize.define('QuizAttempt', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        answers: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 }
        },
        totalMarks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: { min: 0 }
        },
        tabSwitchCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        startedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        completedAt: {
            type: DataTypes.DATE
        }
        // quiz and student handled by associations
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['quiz', 'student']
            }
        ]
    });

    return QuizAttempt;
};
