import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entity/user.entity';
import { Repository } from 'typeorm';
import { EditSCriptDto } from './dto/edit-script.dto';
import { Script } from './entity/script.entity';

@Injectable()
export class ScriptService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Script)
    private scriptRepository: Repository<Script>,
  ) {}

  async readScript(id: number) {
    //script를 반환합니다.
    return await this.scriptRepository.findOneBy({ id });
  }

  async editScript(id: number, editScriptDto: EditSCriptDto) {
    // script을 조회합니다.
    const script = await this.scriptRepository.findOneBy({ id });

    // script가 존재하지 않는다면 예외를 발생시킵니다.
    if (!script) {
      throw new NotFoundException('Script not found');
    }

    // AI API룰 통해 prompt에 해당하는 부분을 반영하여 content 수정
    const content_after = editScriptDto.content_before + editScriptDto.prompt;

    // script.content에서 content_after로 해당 부분 바꿔주기
    script.content = script.content.replace(
      editScriptDto.content_before,
      content_after,
    );

    // script를 저장하고 반환합니다.
    return this.scriptRepository.save(script);
  }
}
