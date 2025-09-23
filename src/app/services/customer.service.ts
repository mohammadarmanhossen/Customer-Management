import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from '../../type';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private baseUrl = 'https://customer-management-5i7p.onrender.com/customer/';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl);
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  createCustomer(payload: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, payload);
  }

  updateCustomer(id: number, payload: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}${id}/`, payload);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}/`);
  }
}
