import mongoose from 'mongoose';

const { Schema } = mongoose;

// 스키마 생성
const PostSchema = new Schema({
  title: String,
  body: String,
  tags: [String],
  publishedDate: {
    type: Date,
    default: Date.now(), // 현재 날짜를 기본값으로 지정
  },
  user: {
    _id: mongoose.Types.ObjectId,
    username: String,
  },
});

// 모델 생성
const Post = mongoose.model('Post', PostSchema); // 모델 인스턴스 만들기('스키마 이름', 스키마 객체)
// 데이터베이스는 스키마 이름을 정해주면 그 이름의 복수 형태로 데이터베이스에 컬렉션 이름을 만든다.
// 이 컨벤션을 따르고 싶지 않다면 세번째 파라미터에 원하는 이름을 넣으면 된다.
// mongoose.model('Post', PostSchema, 'custom_name');  첫번째 파라미터로 넣어 준 이름은 나중에 다른 스키마에서 현재 스키마를 참조해야 하는 상황에서 사용
export default Post;
