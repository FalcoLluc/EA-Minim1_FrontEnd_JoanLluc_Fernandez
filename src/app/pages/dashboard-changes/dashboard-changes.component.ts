import { Component, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListOption, MatList, MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { Change } from '../../models/change.model';
import { Calendar } from '../../models/calendar.model';
import { ChangesService } from '../../services/changes.service';
import { AuthService } from '../../services/auth.service';
import { CalendarsService } from '../../services/calendars.service';

@Component({
  selector: 'app-dashboard-changes',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDialogModule,
    MatListModule,
    MatChipsModule,
    MatTableModule,
    MatIcon,
    MatFabButton,
    MatButton,
    MatPaginator,
    MatCheckboxModule,
    FormsModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard-changes.component.html',
  styleUrl: './dashboard-changes.component.scss',
  standalone: true,
})
export class DashboardChangesComponent {
  selectedChanges = new Set<Partial<Change>>();
  changesService = inject(ChangesService);
  authService = inject(AuthService);
  calendarService = inject(CalendarsService);
  dashboardForm: FormGroup;
  ElementData: Change[] = [];
  displayedColumns: string[] = ['delete', 'date', 'user', 'calendar', 'actionType', 'isDeleted'];
  dataSource: MatTableDataSource<Change>;
  changeForm: FormGroup;
  isFormOpen = false;
  editingChange: Change | null = null;
  originalChange: Change | null = null;
  calendarDetails: Calendar | null = null;
  userDetails: any = null;

  constructor(private form: FormBuilder, private router: Router, private dialog: MatDialog) {
    this.dashboardForm = this.form.group({});
    this.dataSource = new MatTableDataSource();
    this.changeForm = this.form.group({
      date: ['', Validators.required],
      user: ['', Validators.required],
      calendar: ['', Validators.required],
      previousState: this.form.group({
        calendarName: [''],
        appointments: [[]],
        invitees: [[]],
        isDeleted: [false]
      }),
      newState: this.form.group({
        calendarName: [''],
        appointments: [[]],
        invitees: [[]],
        isDeleted: [false]
      }),
      isDeleted: [false]
    });
  }

  pageSize = 5;
  page = 0;
  length = 0;

  ngOnInit(): void {
    this.getPaginatedChanges();
  }

  getPaginatedChanges(): void {
    try {
      this.dataSource.data = [];
      this.changesService.getChanges(this.page, this.pageSize).subscribe({
        next: (data: any) => {
          this.ElementData = data.changes.map((change: any) => ({
            _id: change._id,
            date: new Date(change.date),
            user: change.user,
            calendar: change.calendar,
            previousState: change.previousState,
            newState: change.newState,
            isDeleted: change.isDeleted,
          }));
          this.dataSource.data = this.ElementData;
          this.length = data.totalChanges;
        },
        error: (error: any) => {
          console.error('Error fetching changes:', error);
          alert('Error fetching changes');
        }
      });
    } catch (e) {
      console.error('Error obtaining changes', e);
    }
  }

  openConfirmationDialog(action: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    return dialogRef.afterClosed();
  }

  handlePageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex;
    this.getPaginatedChanges();
  }

  toggleSelection(change: Change, event: any) {
    if (event.checked) {
      this.selectedChanges.add(change);
    } else {
      this.selectedChanges.delete(change);
    }
  }

  toggleSelectAll(event: any) {
    if (event.checked) {
      this.dataSource.data.filter(change => !change.isDeleted).forEach(change => this.selectedChanges.add(change));
    } else {
      this.selectedChanges.clear();
    }
  }

  isAllSelected(): boolean {
    return this.dataSource.data.every(change => this.selectedChanges.has(change));
  }

  isIndeterminate(): boolean {
    return this.selectedChanges.size > 0 && this.selectedChanges.size < this.dataSource.data.length;
  }

  isSelected(change: Change): boolean {
    return this.selectedChanges.has(change);
  }

  deleteSelected() {
    this.openConfirmationDialog('delete').subscribe((confirmed) => {
      if (confirmed) {
        const selectedChangesId: string[] = Array.from(this.selectedChanges)
          .map(change => change._id)
          .filter((id): id is string => id !== undefined);

        this.changesService.deleteChanges(selectedChangesId).subscribe({
          next: () => {
            this.selectedChanges.clear();
            this.getPaginatedChanges();
          },
          error: (err: any) => {
            console.error('Error deleting changes:', err);
          },
        });
      }
    });
  }

  restoreChange(change: Change): void {
    this.openConfirmationDialog('restore').subscribe((confirmed) => {
      if (confirmed) {
        this.changesService.restoreChange(change._id!).subscribe({
          next: (response) => {
            console.log('Change restored:', response);
            change.isDeleted = false;
            this.getPaginatedChanges();
          },
          error: (err) => {
            console.error('Error restoring change:', err);
            alert('Failed to restore the change');
          },
        });
      }
    });
  }

  viewChangeDetails(change: Change) {
    this.editingChange = JSON.parse(JSON.stringify(change));
    this.originalChange = JSON.parse(JSON.stringify(change));
    
    /*
    if (change.calendar) {
      this.calendarService.getCalendarById(change.calendar).subscribe({
        next: (calendar) => {
          this.calendarDetails = calendar;
        },
        error: (err) => console.error('Error fetching calendar details:', err)
      });
    }
    */
    
    if (change.user) {
      this.authService.getUserById(change.user).subscribe({
        next: (user) => {
          this.userDetails = user;
        },
        error: (err) => console.error('Error fetching user details:', err)
      });
    }
  }

  getActionType(change: Change): string {
    if (!change.previousState.calendarName && change.newState.calendarName) {
      return 'Create';
    } else if (change.previousState.isDeleted === false && change.newState.isDeleted === true) {
      return 'Delete';
    } else if (change.previousState.isDeleted === true && change.newState.isDeleted === false) {
      return 'Restore';
    } else {
      return 'Update';
    }
  }

  closeForm(): void {
    this.editingChange = null;
    this.originalChange = null;
    this.calendarDetails = null;
    this.userDetails = null;
    this.isFormOpen = false;
  }

  compareStates(before: any, after: any): {field: string, before: any, after: any}[] {
    const changes: {field: string, before: any, after: any}[] = [];
    
    // Compare simple fields
    if (before.calendarName !== after.calendarName) {
      changes.push({
        field: 'Calendar Name',
        before: before.calendarName,
        after: after.calendarName
      });
    }
    
    // Compare arrays (appointments and invitees)
    if (JSON.stringify(before.appointments) !== JSON.stringify(after.appointments)) {
      changes.push({
        field: 'Appointments',
        before: before.appointments?.join(', ') || 'None',
        after: after.appointments?.join(', ') || 'None'
      });
    }
    
    if (JSON.stringify(before.invitees) !== JSON.stringify(after.invitees)) {
      changes.push({
        field: 'Invitees',
        before: before.invitees?.join(', ') || 'None',
        after: after.invitees?.join(', ') || 'None'
      });
    }
    
    if (before.isDeleted !== after.isDeleted) {
      changes.push({
        field: 'Status',
        before: before.isDeleted ? 'Deleted' : 'Active',
        after: after.isDeleted ? 'Deleted' : 'Active'
      });
    }
    
    return changes;
  }
}