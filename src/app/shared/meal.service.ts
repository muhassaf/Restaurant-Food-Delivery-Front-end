import { Meal } from "./../models/meal.model";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { retry, catchError, map } from "rxjs/operators";
import { throwError, Observable } from "rxjs";
import { Page } from "../pagination/page";
import { Pageable } from "../pagination/pageable";
import { Review } from "../models/review.model";
import { environment } from "../../environments/environment";

const API_V1 = environment.mealServiceEndpoints.API_V1;
const FILES_ENDOINT = environment.mealServiceEndpoints.FILES_ENDOINT;

const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" }),
};

@Injectable({
  providedIn: "root",
})
export class MealService {
  constructor(private http: HttpClient) {}

  getMealsPage(pageable: Pageable): Observable<Page<Meal>> {
    let url =
      API_V1 +
      "/" +
      "?page=" +
      pageable.pageNumber +
      "&size=" +
      pageable.pageSize;
    return this.http.get<Page<Meal>>(url, httpOptions).pipe(
      map((data) => {
        const content: Array<Meal> = data.content.map((meal) => {
          meal.image.file = FILES_ENDOINT + "/" + meal.image.id;
          return meal;
        });
        // Set edited content
        data.content = content;
        // Return data
        return data;
      }),
      retry(5),
      catchError(this.handleHttpError)
    );
  }

  getRating(reviews: Array<Review>): number {
    return (
      reviews
        .map((review) => {
          return review.rating;
        })
        .reduce((rate1, rate2) => rate1 + rate2, 0) / reviews.length
    );
  }

  getPopularMeals() {
    return this.http.get<Array<Meal>>(`${API_V1}/popular`).pipe(
      map((meals) => {
        return meals.map((meal) => {
          meal.image.file = FILES_ENDOINT + "/" + meal.image.id;
          return meal;
        });
      }),
      retry(5),
      catchError(this.handleHttpError)
    );
  }

  getMeal(id) {
    return this.http
      .get<{ meal: Meal; mealPreferred: boolean }>(`${API_V1}/${id}`)
      .pipe(
        map((response) => {
          response.meal.image.file =
            FILES_ENDOINT + "/" + response.meal.image.id;
          return response;
        }),
        retry(5),
        catchError(this.handleHttpError)
      );
  }

  saveMealFormData(formData: FormData) {
    return this.http.post<Meal>(`${API_V1}/`, formData);
  }

  handleHttpError(error) {
    let errorMessage = "";
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
