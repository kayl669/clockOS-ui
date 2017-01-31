import { ClockOSPage } from './app.po';

describe('clock-os App', function() {
  let page: ClockOSPage;

  beforeEach(() => {
    page = new ClockOSPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
