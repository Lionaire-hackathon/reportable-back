import { ApiProperty } from "@nestjs/swagger";

// CreateFileDto는 파일을 생성할 때 사용하는 데이터 전송 객체입니다.
export class FileDto {
  @ApiProperty({
    type: 'file', // 파일을 전송할 때 사용하는 타입입니다.
    // 파일을 전송할 때 사용하는 파일의 속성입니다.
    properties: {
      file: {
        type: 'string', // 파일의 타입입니다.
        format: 'binary', // 파일의 포맷입니다.
      },
    },
  })
  // 파일을 전송할 때 사용하는 파일입니다.
  // Express.Multer.File는 Express 프레임워크에서 파일을 다룰 때 사용하는 타입입니다.
  file: Express.Multer.File;
}
