module.exports = (sequelize, DataTypes) => {
    const Submission = sequelize.define('Submission', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM('case_study', 'file_upload', 'code'),
            allowNull: false
        },
        textContent: {
            type: DataTypes.TEXT
        },
        filePath: {
            type: DataTypes.STRING
        },
        codeContent: {
            type: DataTypes.TEXT
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        grade: {
            type: DataTypes.FLOAT, // Assuming grades might be floats or integers
            validate: { min: 0 }
        },
        feedback: {
            type: DataTypes.TEXT
        }
        // assignment and student are handled via associations
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['assignment', 'student'] // Use associated keys
            }
        ]
    });

    return Submission;
};
