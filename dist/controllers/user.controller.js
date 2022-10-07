"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInUser = exports.createUser = exports.deleteUser = exports.getUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fetch_1 = __importDefault(require("../database/fetch"));
const User_1 = require("../models/User");
const socket_1 = require("../socket");
const StatusError_1 = require("../types/StatusError");
const { sign } = jsonwebtoken_1.default;
const getUser = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized action' });
            return;
        }
        const user = fetch_1.default.getUser(req.user);
        if (user) {
            res.status(200).json(user);
            return;
        }
        res.status(404).json({ message: 'User not found' });
    }
    catch (error) {
        const statusError = new StatusError_1.StatusError('Error while fetching data', 500);
        return next(statusError);
    }
};
exports.getUser = getUser;
const deleteUser = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized action' });
            return;
        }
        fetch_1.default.deleteUser(req.user);
        (0, socket_1.getIO)().emit('users', { action: 'delete', userId });
        res.status(201).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        const statusError = new StatusError_1.StatusError('Error while fetching data', 500);
        return next(statusError);
    }
};
exports.deleteUser = deleteUser;
const createUser = (req, res, next) => {
    var _a;
    const { name, lastName, email, password } = req.body;
    const image = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    if (!image) {
        res.status(422).json({ message: 'Missing image file' });
        return;
    }
    if (validAttributes(name, lastName, email, password, image)) {
        const user = new User_1.User(name, lastName, email, password, image);
        try {
            if (!fetch_1.default.getUserByEmail(email)) {
                fetch_1.default.createUser(user);
                (0, socket_1.getIO)().emit('users', { action: 'register', userId: user.userId });
                res.status(201).json({ message: 'User registered successfully' });
                return;
            }
            res.status(409).json({ message: 'User already registered' });
            return;
        }
        catch (error) {
            const statusError = new StatusError_1.StatusError('Error while fetching data', 500);
            return next(statusError);
        }
    }
    else {
        res.status(400).json({
            message: 'Bad Request: Make sure all attributes and their types are OK',
            attributes: { name, lastName, email, password }
        });
    }
};
exports.createUser = createUser;
const logInUser = (req, res, next) => {
    const { email, password } = req.body;
    if (validAttributes('', '', email, password, '')) {
        try {
            const ok = fetch_1.default.existsUser(email, password);
            if (ok) {
                const { userId } = fetch_1.default.getUserByEmail(email);
                const token = sign({
                    userId
                }, 'toremsoftware', { expiresIn: '1h' });
                res.status(201).json({ message: 'Logged In successfully', userId, token });
                return;
            }
            res.status(401).json({ message: 'Incorrect email or password' });
        }
        catch (error) {
            const statusError = new StatusError_1.StatusError('Error while fetching data', 500);
            return next(statusError);
        }
    }
    else {
        res.status(400).json({
            message: 'Bad Request: Make sure all attributes and their types are OK',
            attributes: { email, password }
        });
    }
};
exports.logInUser = logInUser;
const validAttributes = (name, lastName, email, password, image) => {
    return (typeof name == 'string' &&
        typeof lastName == 'string' &&
        typeof email == 'string' &&
        typeof password == 'string' &&
        typeof image == 'string');
};
