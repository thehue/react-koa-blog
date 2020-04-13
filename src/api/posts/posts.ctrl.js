import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from 'joi';

const { ObjectId } = mongoose.Types;

// 미들웨어 추가(mongoId가 맞는 타입인지 체크)
// 작성자만 포스트를 수정하거나 삭제할 수 있도록
export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400; // Bad Request
    return;
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 404;
      return;
    }

    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

// id로 찾은 포스트가 로그인 중인 사용자가 작성한 포스트인지 확인
export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

/* POST /api/posts
{ 
  title: '제목',
  body: '내용',
  tags: ['태그1', '태그2']
}
*/

export const write = async (ctx) => {
  //request body 검증
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body,
    tags,
    user: ctx.state.user,
  });

  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/posts?username=&tag=&page=
*/

export const list = async (ctx) => {
  // query는 문자열이기 때문에 숫자로 변환
  // default page: 1
  const page = parseInt(ctx.query.page || '1', 10); // 10진수 숫자로 변환

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { tag, username } = ctx.query;
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: { $regex: tag, $options: 'i' } } : {}),
  };

  try {
    //find: 데이터 조회, exec: 서버에 쿼리 요청
    // sort: -1 : 내림차순, 1 : 오름차순
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean() //JSON 형태로 조회
      .exec();

    // 포스트 갯수
    const postCount = await Post.countDocuments(query).exec();
    // 커스텀 HTTP 헤더 설정
    ctx.set('Last-Page', Math.ceil(postCount / 10));
    // 200자 이상이면 뒤에 ...를 붙이고 문자열을 자르기
    ctx.body = posts.map((post) => ({
      ...post,
      body:
        post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`,
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/posts/:id
*/
export const read = async (ctx) => {
  ctx.body = ctx.state.post;
};

/*
  DELETE /api/posts/:id
*/
export const remove = async (ctx) => {
  const { id } = ctx.params;
  try {
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204; // 성공했긴 했지만 응답할 데이터 없음
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  PATCH /api/posts/:id
  {
    title: '수정',
    body: '수정',
    tags: ['수정', '수정']
  }
*/
export const update = async (ctx) => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  try {
    const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
      new: true, // 이 값을 설정하면 업데이트된 데이터를 반환함.
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};
