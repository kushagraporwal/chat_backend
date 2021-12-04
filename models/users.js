const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const schema = mongoose.Schema;

const user = new schema({
    email:{
        type: String,
        required: true,
        unique: true
    },
    connections:[
        {
            type: schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    incoming_request:[
        {
            type: schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    outgoing_request:[
        {
            type: schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    announcements:[
        {
            type: String
        }
    ],
});
user.plugin(plm);
module.exports = mongoose.model('User', user);