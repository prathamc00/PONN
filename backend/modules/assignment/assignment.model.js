module.exports = (sequelize, DataTypes) => {
    const Assignment = sequelize.define('Assignment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Assignment title is required' }
            }
        },
        type: {
            type: DataTypes.ENUM('case_study', 'file_upload', 'code'),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Assignment type is required' }
            }
        },
        instructions: {
            type: DataTypes.TEXT,
        },
        module: {
            type: DataTypes.STRING,
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Due date is required' }
            }
        },
        maxMarks: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            validate: { min: 1 }
        }
        // course and createdBy handled by associations
    }, {
        timestamps: true
    });

    return Assignment;
};
