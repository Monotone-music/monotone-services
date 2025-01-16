const schemaOptions = {
    toJSON: {
        transform: function (doc, ret) {
            // Omit the __v field
            delete ret.__v;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.__v;
        }
    },
    timestamps: true
};

module.exports = schemaOptions;