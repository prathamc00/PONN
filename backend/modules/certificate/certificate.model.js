module.exports = (sequelize, DataTypes) => {
    const Certificate = sequelize.define('Certificate', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Certificate title is required' }
            }
        },
        type: {
            type: DataTypes.ENUM('course_completion', 'quiz_pass'),
            defaultValue: 'course_completion'
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: true
        },
        scorePercent: {
            type: DataTypes.FLOAT,
            validate: {
                min: 0,
                max: 100
            }
        },
        earnedDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        certificateId: {
            type: DataTypes.STRING,
            unique: true
        }
        // user and course handled by associations
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['student', 'course', 'type'] // Note: using 'student' because of association naming in index
            }
        ],
        hooks: {
            beforeValidate: (certificate) => {
                if (!certificate.certificateId) {
                    const prefix = 'CRSM';
                    const timestamp = Date.now().toString(36).toUpperCase();
                    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                    certificate.certificateId = `${prefix}-${timestamp}-${random}`;
                }
            }
        }
    });

    return Certificate;
};
