/** Plugin toJSON commun — retire passwordHash, __v et champs sensibles */

export function toJSONPlugin(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
      delete ret.__v;
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      return ret;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
  });
}
