import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
});

// 모델의 인스턴스 메서드, 화살표 함수 사용하면 x(this 때문에)
UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10); //10: salt값 -> salt값과 해시된 비밀번호를 합쳐 데이터베이스에 저장하게 되면 같은 값을 넣게 되어도 다른 암호화된 비밀번호가 반환됨.
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result; // true or false
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

// 모델의 스태틱 함수
//username으로 데이터를 하나 찾아오기
UserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username }); //this -> User
};

// 토큰 발급하기
UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    // 토큰 안에 집어 넣고 싶은 데이터
    {
      _id: this.id,
      username: this.username,
    },
    process.env.JWT_SECRET, //파라미터 암호
    {
      expiresIn: '7d', // 7일 동안 유호
    },
  );
  return token;
};

const User = mongoose.model('User', UserSchema);
export default User;
