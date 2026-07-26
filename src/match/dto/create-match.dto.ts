export class CreateMatchDto {
  homeTeam: string;
  awayTeam: string;
  startTime: Date; // ISO 8601 문자열로 받아 Date로 변환
}
