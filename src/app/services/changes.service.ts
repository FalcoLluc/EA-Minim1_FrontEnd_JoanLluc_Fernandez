import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Change } from '../models/change.model';

@Injectable({
  providedIn: 'root'
})
export class ChangesService {
  private static apiUrl = 'http://localhost:8080/changes';

  constructor(private http: HttpClient) { }

  getChanges(page: number = 0, limit: number = 5, getDeleted: boolean = false, calendarId?: string): 
    Observable<{changes: Change[], totalPages: number, totalChanges: number, currentPage: number}> {
    let params: any = {
      page: page.toString(),
      limit: limit.toString(),
      getDeleted: getDeleted.toString()
    };

    if (calendarId) {
      params.calendarId = calendarId;
    }

    return this.http.get<{changes: Change[], totalPages: number, totalChanges: number, currentPage: number}>(
      ChangesService.apiUrl,
      { params }
    );
  }

  getChangesByCalendar(calendarId: string): Observable<Change[]> {
    return this.http.get<Change[]>(`${ChangesService.apiUrl}/calendar/${calendarId}`);
  }

  getChangeById(changeId: string): Observable<Change> {
    return this.http.get<Change>(`${ChangesService.apiUrl}/${changeId}`);
  }

  createChange(changeData: Partial<Change>): Observable<Change> {
    return this.http.post<Change>(
      ChangesService.apiUrl,
      changeData,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  editChange(changeId: string, changeData: Partial<Change>): Observable<Change> {
    return this.http.put<Change>(
      `${ChangesService.apiUrl}/${changeId}`,
      changeData,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  softDeleteChange(changeId: string): Observable<Change> {
    return this.http.patch<Change>(
      `${ChangesService.apiUrl}/${changeId}/soft-delete`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  deleteChanges(changeIds: string[]): Observable<Change[]> {
    // Note: This would need a batch endpoint on your backend
    // If not available, you might need to call softDeleteChange for each ID
    return this.http.patch<Change[]>(
      `${ChangesService.apiUrl}/batch-soft-delete`, // This endpoint doesn't exist in your routes
      { changeIds },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  restoreChange(changeId: string): Observable<Change> {
    return this.http.patch<Change>(
      `${ChangesService.apiUrl}/${changeId}/restore`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  hardDeleteChange(changeId: string): Observable<void> {
    return this.http.delete<void>(
      `${ChangesService.apiUrl}/${changeId}/hard-delete`
    );
  }
}