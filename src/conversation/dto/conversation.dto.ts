import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty()
  @IsMongoId()
  sender: string;

  @IsNotEmpty()
  @IsMongoId()
  receiver: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
