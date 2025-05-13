const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const e = require('express');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username é obrigatório'],
        unique: false,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
    },
    resetToken: String,
    resetTokenExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    lastLoginDate: Date,
    isActive: {
        type: Boolean,
        default: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    }
}, {
    timestamps: true
});

UserSchema.pre('save', async function (next) {
    const user = this;

    if (!user.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

module.exports = mongoose.model('User', UserSchema);