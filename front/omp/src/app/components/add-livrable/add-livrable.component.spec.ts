import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLivrableComponent } from './add-livrable.component';

describe('AddLivrableComponent', () => {
  let component: AddLivrableComponent;
  let fixture: ComponentFixture<AddLivrableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLivrableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLivrableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
