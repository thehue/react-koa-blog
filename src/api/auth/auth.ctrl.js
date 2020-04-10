import Joi from 'joi';
import User from '../../models/user';
/*
  POST /api/auth/register
  {
    username: 'username',
    password: 'password12'
  }
*/

export const register = async (ctx) => {
  // Request Body 검증하기
  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum() //a-z, A-Z, 0-9 만 가능
      .min(3)
      .max(20)
      .required(),
    password: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 404;
    ctx.body = result.error;
    return;
  }

  const { username, password } = ctx.request.body;
  try {
    // username이 존재하는지 확인
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409;
      return;
    }

    const user = new User({
      username,
    });
    await user.setPassword(password);
    await user.save(); //데이터베이스에 저장

    // 응답할 데이터에서 hashedPassword 필드 제거
    ctx.body = user.serialize();

    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true, //악성 자바스크립트 파일 방지
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  POST /api/auth/login
  {
    username: 'username',
    password: 'password12'
  }
*/

export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  if (!username || !password) {
    ctx.status = 401; // Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    // 계정이 존재하지 않으면 에러 처리
    if (!user) {
      ctx.status = 401;
      return;
    }

    //계정이 존재하면 해당 계정과 비밀번호가 맞는지 확인
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    // password는 삭제해서 보내준다
    ctx.body = user.serialize();

    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/auth/check
*/
export const check = async (ctx) => {
  // 로그인 상태 확인
  const { user } = ctx.state;
  if (!user) {
    // 로그인 중 아님
    ctx.status = 401; // Unauthorized
    return;
  }
  ctx.body = user;
};

/*
  POST /api/auth/logout
*/
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204; // No Content
};
