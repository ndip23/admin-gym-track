const mongoose = require("mongoose");
const memberSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobNo: {
        type: String,
    },
    address: {
        type: String,
    },
    profilePic: {
        type: String,
        required: true
    }, 
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'membership',
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gym',
        required: true
    },
    status: {
        type: String,
        default: 'active'
    },
    lastPayment: {
        type: Date,
        default: new Date()
    },
    nextBillDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });
const memberModal = mongoose.model('member', memberSchema);
module.exports = memberModal;
