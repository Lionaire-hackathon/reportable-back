import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ScriptService } from './script.service';
import { EditSCriptDto } from './dto/edit-script.dto';

@Controller('script')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get(':id')
  async read(@Param('id') id: number) {
    return this.scriptService.readScript(id);
  }

  @Put(':id')
  async edit(@Param('id') id: number, @Body() editScriptDto: EditSCriptDto) {
    return this.scriptService.editScript(id, editScriptDto);
  }
}
