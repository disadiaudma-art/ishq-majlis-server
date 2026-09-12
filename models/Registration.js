const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name / പേര് is required'],
      trim: true,
    },
    place: {
      type: String,
      required: [true, 'Place / സ്ഥലം is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: false,
    },
    hasAboveThreeYears: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    gender: {
      type: String,
      required: [true, 'Gender / ലിംഗഭേദം is required'],
      enum: ['Male', 'Female'],
    },
    attendeesCount: {
      type: Number,
      required: [true, 'Number of Attendees / പങ്കെടുക്കുന്നവരുടെ എണ്ണം is required'],
      min: 1,
      default: 1,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number / വാട്സ്ആപ്പ് നമ്പർ is required'],
      trim: true,
    },
    whatsappCommunityConcern: {
      type: String,
      required: [true, 'WhatsApp community response / വാട്സ്ആപ്പ് കമ്മ്യൂണിറ്റി പ്രതികരണം is required'],
      enum: ['Yes', 'No'],
      trim: true,
    },
    registrationId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Auto-generate unique registration ID for pass (e.g. IM-2026-0001)
registrationSchema.pre('save', async function () {
  if (!this.registrationId) {
    const latest = await mongoose
      .model('Registration')
      .findOne({ registrationId: /^IM-2026-\d+$/ })
      .sort({ registrationId: -1 });

    let nextNum = 1;
    if (latest && latest.registrationId) {
      const match = latest.registrationId.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }

    while (await mongoose.model('Registration').exists({ registrationId: `IM-2026-${String(nextNum).padStart(4, '0')}` })) {
      nextNum++;
    }

    this.registrationId = `IM-2026-${String(nextNum).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
