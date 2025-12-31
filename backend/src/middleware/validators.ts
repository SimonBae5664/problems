import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('이름을 입력해주세요')
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('이메일을 입력해주세요')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해주세요')
    .isLength({ min: 3, max: 20 })
    .withMessage('아이디는 3자 이상 20자 이하여야 합니다')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('아이디는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'),
];

export const loginValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('아이디를 입력해주세요'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요'),
];

