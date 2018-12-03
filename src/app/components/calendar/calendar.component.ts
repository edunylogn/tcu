import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth,isSameDay, isSameMonth, addHours, addMinutes } from 'date-fns';
import { Subject } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarView } from 'angular-calendar';

import { EventInterface } from '../../models/eventInterface';
import { EventService } from '../../services/event.service';
import { SectionService } from 'src/app/services/section.service';
import { SectionInterface } from 'src/app/models/sectionInterface';
import { AuthService } from '../../services/auth.service';
import { UserInterface } from 'src/app/models/userInterface';

const colors: any = {
  red: { primary: '#ad2121', secondary: '#FAE3E3' },
  blue: { primary: '#1e90ff', secondary: '#D1E8FF' },
  yellow: { primary: '#e3bc08', secondary: '#FDF1BA' }
};

@Component({
  selector: 'calendar-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'calendar.component.html'
})

export class CalendarComponent {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  clickedDate: Date;

  modalData: {
    action: string;
    event: CalendarEvent;
  };
  sections: SectionInterface[];
  idSectionSelected: string | number;

  // actions: CalendarEventAction[] = [
  //   {
  //     label: '<i class="fa fa-fw fa-pencil"></i>',
  //     onClick: ({ event }: { event: CalendarEvent }): void => {
  //       this.handleEvent('Edited', event);
  //     }
  //   },
  //   {
  //     label: '<i class="fa fa-fw fa-times"></i>',
  //     onClick: ({ event }: { event: CalendarEvent }): void => {
  //       this.events = this.events.filter(iEvent => iEvent !== event);
  //       this.handleEvent('Deleted', event);
  //     }
  //   }
  // ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];
  eventsData: EventInterface[];

  activeDayIsOpen: boolean = true;
  
  editState: boolean = false;
  eventToEdit: EventInterface;
  constructor(public dialog: MatDialog, private eventService: EventService, private sectionService : SectionService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.getUser().subscribe(user=>{
      if (user.idPerson) {
        this.sectionService.getSections().subscribe(sections=>{
          this.sections=sections.filter(s => s.idTeacher === user.idPerson);
          this.idSectionSelected = sections[0].id;
    
          this.eventService.getEvents().subscribe(events => {
            this.eventsData = events.filter(e => e.idSection === this.idSectionSelected);
            this.events = this.eventsData.map((event: EventInterface) => {
                return {
                  id: event.id,
                  start: addMinutes(new Date(event.date), new Date(event.date).getTimezoneOffset()),
                  title: event.title,
                };
              });
          });
        });
      }
    });
  }

  filterBySection(idSection) {
    this.idSectionSelected = idSection;
  }

  /////////

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      this.viewDate = date;
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    // this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  handleEvent(action: string, event: CalendarEvent): void {
    const ev = this.eventsData.find(e => e.id === event.id);
    this.dialog.open(CalendarEventModalComponent, { data: ev });
  }

  addEvent(): void {
    this.events.push({
      title: 'New event',
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
      color: colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      }
    });
    this.refresh.next();
  }

  getSectionName(id: Number) {
    if (this.sections) {
      const section = this.sections.find(p => p.id === id);
      return section ? section.idSection : id;
    }
  }
}


@Component({
  selector: 'calendar-event-modal',
  templateUrl: 'calendar-event-modal.html',
})

export class CalendarEventModalComponent {

  constructor(
    public dialogRef: MatDialogRef<CalendarEventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventInterface
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}