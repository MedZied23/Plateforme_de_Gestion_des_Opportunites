import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayFeuilTwoComponent } from './display-feuil-two.component';

describe('DisplayFeuilTwoComponent', () => {
  let component: DisplayFeuilTwoComponent;
  let fixture: ComponentFixture<DisplayFeuilTwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayFeuilTwoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayFeuilTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
