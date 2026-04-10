const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name is required' }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { msg: 'Email is already registered' },
            validate: {
                isEmail: { msg: 'Please enter a valid email' }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
            }
        },
        college: {
            type: DataTypes.STRING,
        },
        branch: {
            type: DataTypes.STRING,
        },
        semester: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 8
            }
        },
        phone: {
            type: DataTypes.STRING,
        },
        role: {
            type: DataTypes.ENUM('student', 'instructor', 'admin'),
            defaultValue: 'student'
        },
        approvalStatus: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            // We set default via hook because it depends on role
            // defaultValue is fixed to 'approved' if not set
        },
        aadhaarCardPath: {
            type: DataTypes.STRING,
            defaultValue: null
        },
        aadhaarVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true,
        defaultScope: {
            attributes: { exclude: ['password'] } // Like mongoose select: false
        },
        scopes: {
            withPassword: { attributes: {} } // Use to include password when needed
        },
        hooks: {
            beforeValidate: (user) => {
                if (user.approvalStatus === undefined) {
                    user.approvalStatus = user.role === 'instructor' ? 'pending' : 'approved';
                }
            },
            beforeSave: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    User.prototype.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    return User;
};
