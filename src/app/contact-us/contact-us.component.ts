import { ContactService } from "./../shared/contact.service";
import { ContactMessage } from "./../models/contact-message.model";
import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2'
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent implements OnInit, OnDestroy {

  form;
  contactMessage: ContactMessage = new ContactMessage();
  @ViewChild('sendBtn') sendBtn: ElementRef;
  formSubmitted = false;
  errorMode = false;
  subscription: Subscription;

  constructor(public contactService: ContactService, public titleService: Title) { }

  ngOnInit() {
    // Set page title
    this.titleService.setTitle('Contact us');
    this.form = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]),
      email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(60)]),
      phone: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(14)]),
      content: new FormControl('', [Validators.required, Validators.minLength(100), Validators.maxLength(15000)]),
    });
  }

  ngOnDestroy() {
    this.errorMode = false;
    this.formSubmitted = false;
    if( this.subscription != null ) {
      this.subscription.unsubscribe();
    }
  }

  onSendMessage() {
    if( !this.form.valid ) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'Form data not valid!'
      })
    } else {
      (<HTMLElement>this.sendBtn.nativeElement).innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending';
      (<HTMLElement>this.sendBtn.nativeElement).attributes['disabled'] = true;
      this.contactMessage.email = this.form.controls.email.value;
      this.contactMessage.firstName = this.form.controls.firstName.value;
      this.contactMessage.lastName = this.form.controls.lastName.value;
      this.contactMessage.phone = this.form.controls.phone.value;
      this.contactMessage.content = this.form.controls.content.value;
      const formData = new FormData();
      this.subscription = this.contactService.sendContactMessage(this.contactMessage).subscribe(
        (message: ContactMessage) => {
          console.log(message);
          this.formSubmitted = true;
          this.errorMode = false;
        },
        (err) => {
          (<HTMLElement>this.sendBtn.nativeElement).innerHTML = '<i class="far fa-paper-plane"></i> Send message';
          (<HTMLElement>this.sendBtn.nativeElement).attributes['disabled'] = false;
          this.errorMode = true;
          this.formSubmitted = false;
        })
    }
  }

}
