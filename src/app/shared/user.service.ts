import { AuthService } from './auth/auth.service';
import { catchError, retry } from 'rxjs/operators';
import { User } from './../models/user.model';
import { HttpClient, HttpParams, HttpEventType } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { map } from 'rxjs/operators';
import { throwError, pipe } from 'rxjs';
import { Router } from '@angular/router';
import { Order } from '../models/order.model';
import { Meal } from '../models/meal.model';
import { ConstantsService } from './constants.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
 
  public static API_ENDPOINT = "http://localhost:8080/api";
  public static API_V1_ENDPOINT = "http://localhost:8080/api/v1/users/";
  public static SIGN_UP_ENDPOINT = "http://localhost:8080/api/v1/users/";
  public static ACTIVATION_ACCOUNT_ENDPOINT =
    "http://localhost:8080/api/v1/users/activation";
  public static PASSWORD_RESET_ENDPOINT =
    "http://localhost:8080/api/v1/users/passwordreset";
  public static UPDATE_EMAIL_ENDPOINT =
    "http://localhost:8080/api/v1/users/email";
  public static UPDATE_IMAGE_ENDPOINT =
    "http://localhost:8080/api/v1/users/image";
  public static TOKEN_ENDPOINT = "http://localhost:8080/api/v1/users/tokens";
  public static AUTHENTICATED_USER_ORDERS_HISTORY =
    "http://localhost:8080/api/v1/orders/authuser";
  public static USERS_PREFERRED_MEALS =
    "http://localhost:8080/api/v1/users/preferences";
  public static USER_ORDERS_API_ENDPOINT =
    "http://localhost:8080/api/orders/search/findByUserEmail";
  public static USER_DETAILS_API_ENDPOINT =
    "http://localhost:8080/api/v1/users/current";
  public static FILES_ENDOINT =
    "http://localhost:8080/api/v1/restaurantfiles/file";

  public userUpdateEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  register(user: User) {
    return this.http.post<User>(UserService.SIGN_UP_ENDPOINT, user).pipe(
      map((user) => {
        return user;
      }, catchError(this.handleHttpError))
    );
  }

  activateAccount(token: string) {
    return this.http
      .get<{ status: boolean; message: string }>(
        `${UserService.ACTIVATION_ACCOUNT_ENDPOINT}/${token}`
      )
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  sendPasswordResetToken(email: string) {
    return this.http
      .get<{ status: boolean; message: string }>(
        `${UserService.PASSWORD_RESET_ENDPOINT}?email=${email}`
      )
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  resetPassword(token: string, newPassword: string) {
    return this.http
      .post<{ status: boolean; message: string }>(
        `${UserService.PASSWORD_RESET_ENDPOINT}`,
        { token: token, newPassword: newPassword }
      )
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  checkPasswordResetToken(token: string) {
    return this.http
      .get<{ status: boolean; message: string }>(
        `${UserService.TOKEN_ENDPOINT}/${token}/check`
      )
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  getAuthenticatedUserDetails() {
    return this.http
      .get<User>(`${UserService.USER_DETAILS_API_ENDPOINT}`, {
        params: new HttpParams().append(
          'email',
          this.authService.getAuthenticatedUser().email
        ),
      })
      .pipe(
        map((data) => {
          console.log(data);
          data.image.file = ConstantsService.FILES_ENDOINT + '/' + data.image.id;
          return data;
        }),
        retry(5),
        catchError((error) => {
          console.log(error);
          // Logout user
          // this.authService.logout();
          // Redirect user to login page
          // this.router.navigateByUrl('/login');
          // Handle error
          return this.handleHttpError(error);
        })
      );
  }

  getUserOrdersHistory() {
    return this.http
      .get<Array<Order>>(`${UserService.AUTHENTICATED_USER_ORDERS_HISTORY}`)
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  getUserPreferredMeals() {
    return this.http
      .get<Array<Meal>>(`${UserService.USERS_PREFERRED_MEALS}`)
      .pipe(retry(5), catchError(this.handleHttpError));
  }

  toggleMealFromPreferrences(id) {
    return this.http
      .post<{status: boolean, preferred: boolean, message: string}>(`${UserService.USERS_PREFERRED_MEALS}?id=${id}`, {})
      .pipe(retry(5), catchError(this.handleHttpError));
  }
  
  saveUser(username: string, location: string, userId: number) {
    return this.http
      .patch<User>(`${UserService.API_ENDPOINT}/users/${userId}`, {
        username: username,
        location: location,
      })
      .pipe(
        map((data) => {
          // Emit user update event
          this.userUpdateEvent.emit(true);
          return data;
        }),
        catchError(this.handleHttpError)
      );
  }

  updateUserImage(formData: FormData) {
    return this.http
      .post<{ status: boolean; message: string; user: User }>(
        UserService.UPDATE_IMAGE_ENDPOINT,
        formData,
        { reportProgress: true, observe: 'events' }
      )
      .pipe(
        map((event) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = Math.round((100 * event.loaded) / event.total);
              return { status: 'progress', message: progress };

            case HttpEventType.Response:
              // Emit user update event
              this.userUpdateEvent.emit(true);
              event.body.user.image.file = ConstantsService.FILES_ENDOINT + '/' + event.body.user.image.id;
              return event.body;
            default:
              return `Unhandled event: ${event.type}`;
          }
        }),
        retry(2),
        catchError(this.handleHttpError)
      );
  }

  updateUserEmail(email: string) {
    return this.http
      .post<{ status: boolean; message: string }>(
        `${UserService.UPDATE_EMAIL_ENDPOINT}`,
        new HttpParams().append('email', email)
      )
      .pipe(
        map((data) => {
          // Emit user update event
          this.userUpdateEvent.emit(true);
          return data;
        }),
        catchError(this.handleHttpError)
      );
  }

  handleHttpError(error) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
