
import mongoose from 'mongoose';



const UploadSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
});


export const UploadModel = mongoose.model('Upload', UploadSchema);