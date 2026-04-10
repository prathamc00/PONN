module.exports = (sequelize, DataTypes) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Course title is required' }
            }
        },
        description: {
            type: DataTypes.TEXT,
        },
        instructor: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Instructor is required' }
            }
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Category is required' }
            }
        },
        level: {
            type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
            defaultValue: 'Beginner'
        },
        lessons: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: { min: 1 }
        },
        durationHours: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: { min: 1 }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        // We use JSON for embedded arrays if they don't need complex relational queries
        modules: {
            type: DataTypes.JSON,
            defaultValue: []
        }
        // createdBy and enrolledStudents are handled by associations in models/index.js
    }, {
        timestamps: true
    });

    return Course;
};
