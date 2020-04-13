import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { PaymentService } from "../shared/payment.service";
import { Title } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import {
  StripeService,
  Elements,
  Element as StripeElement,
  ElementsOptions,
  StripeCardComponent,
  ElementOptions,
} from "ngx-stripe";
import { FormGroup, Validators, FormControl } from "@angular/forms";

declare var Stripe: any;
// Your Stripe public key
const stripe = Stripe("pk_test_123456123456123456");

// Create `card` element that will watch for updates
// and display error messages
const elements = stripe.elements();

@Component({
  selector: "app-checkout",
  templateUrl: "./checkout.component.html",
  styleUrls: ["./checkout.component.css"],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private checkoutSubscription: Subscription;
  private stripeSubscriptio: Subscription;
  public message: string;
  public isLoading: boolean = true;
  public isError: boolean = false;
  public isNoOrder: boolean = false;
  public checkoutData: {
    amount: number;
    stripePublicKey: string;
    noActiveOrder: Boolean;
    currency: string;
    status: boolean;
  } = null;

  // Stripe elements
  error: any;
  elements: Elements;
  @ViewChild(StripeCardComponent) card: StripeCardComponent;
  cardOptions: ElementOptions = {
    style: {
      base: {
        iconColor: "#666EE8",
        color: "#31325F",
        lineHeight: "40px",
        fontWeight: 300,
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: "18px",
        "::placeholder": {
          color: "#CFD7E0",
        },
      },
    },
  };
  elementsOptions: ElementsOptions = {
    locale: "en",
  };
  public stripeForm: FormGroup;
  @ViewChild("proceedBtn", { static: false }) proceedBtn: ElementRef;

  constructor(
    private paymentService: PaymentService,
    private titleService: Title,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    // Set page title
    this.titleService.setTitle("Checkout");
    // Initialize stripe form
    this.stripeForm = new FormGroup({
      name: new FormControl("", Validators.required),
    });
    // Fetch checkout data
    this.checkoutSubscription = this.paymentService.getCheckoutData().subscribe(
      (checkoutData) => {
        // Check if user has an order in progress
        if (
          checkoutData.status == true &&
          checkoutData.noActiveOrder == false
        ) {
          this.checkoutData = checkoutData;
          console.log(checkoutData);
        } else {
          // Set no checkout order in place
          this.isNoOrder = true;
          this.isError = false;
          this.message = "No order in place, please add products to your cart!";
        }
      },
      (error) => {
        this.message = "An error occurred!";
        this.isNoOrder = false;
        this.isError = true;
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  ngOnDestroy() {
    // Unsubscribe from subscritpions
    if (this.checkoutSubscription != null) {
      this.checkoutSubscription.unsubscribe();
    }
    if (this.stripeSubscriptio != null) {
      this.stripeSubscriptio.unsubscribe();
    }
  }

  buy() {
    const name = this.stripeForm.get("name").value;
    // Set proceed button state
    const originalBtn = (this.proceedBtn.nativeElement as HTMLButtonElement)
      .innerHTML;
    (this.proceedBtn.nativeElement as HTMLButtonElement).innerHTML = `
      <div class="spinner-border spinner-border-sm text-light" role="status">
        <span class="sr-only">Loading...</span>
      </div> Proceeding
    `;
    (this.proceedBtn.nativeElement as HTMLButtonElement).disabled = true;
    this.stripeSubscriptio = this.stripeService
      .createToken(this.card.getCard(), { name })
      .subscribe((result) => {
        if (result.token) {
          // const paymentIntentDto: PaymentIntentDto = {
          //   token: result.token.id,
          //   amount: this.precio,
          //   currency: 'EUR',
          //   description: this.descripcion
          // };
          // this.paymentService.pagar(paymentIntentDto).subscribe(
          //   data => {
          //     this.abrirModal(data[`id`], this.nombre, data[`description`], data[`amount`]);
          //     this.router.navigate(['/']);
          //   }
          // );
          // this.error = null;
          console.log("Token: " + JSON.stringify(result.token));
        } else if (result.error) {
          this.error = result.error.message;
        }
        // Set origin button state
        (this.proceedBtn
          .nativeElement as HTMLButtonElement).innerHTML = originalBtn;
        (this.proceedBtn.nativeElement as HTMLButtonElement).disabled = false;
      });
  }
}