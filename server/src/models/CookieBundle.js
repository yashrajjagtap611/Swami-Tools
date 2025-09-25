import mongoose from 'mongoose';

const cookieBundleSchema = new mongoose.Schema({
  cookies: [{ 
    name: String,
    value: String,
    domain: String,
    path: String,
    secure: Boolean,
    httpOnly: Boolean,
    sameSite: String,
    expirationDate: Number
  }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, required: true }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

export const CookieBundle = mongoose.model('CookieBundle', cookieBundleSchema);



