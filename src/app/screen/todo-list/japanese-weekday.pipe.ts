import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'japaneseWeekday',
  standalone: true
})
export class JapaneseWeekdayPipe implements PipeTransform {
  transform(date: Date | string): string {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(date);
    return weekdays[d.getDay()];
  }
}