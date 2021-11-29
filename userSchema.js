const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: String,
    work: Number,
    short_break: Number,
    long_break: Number,
    sessions: Number,
    pausable: Boolean ,
    paused: Boolean ,
    paused_time: Date,
    paused_tick: Number,
    stopped: Boolean,
    session_status: String,
    session_time: Date,
    pomodoro_counter: Number,
    total_pomodoros: Number,
    tick: Number,
    count_in_min: Number,
    session_time_raw: Number,
    sessions_remaining: Number,
    mode: Number,
    count: Number
  });

module.exports = userSchema