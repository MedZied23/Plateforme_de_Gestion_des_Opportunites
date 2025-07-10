import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCvsComponent } from './search-cvs.component';

describe('SearchCvsComponent', () => {
  let component: SearchCvsComponent;
  let fixture: ComponentFixture<SearchCvsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchCvsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchCvsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
