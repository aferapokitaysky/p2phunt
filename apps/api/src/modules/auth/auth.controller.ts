import { Body, Controller, Get, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator.js";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { AuthService } from "./auth.service.js";
import { LoginDto, RefreshDto, RegisterDto } from "./dto.js";

// Login/register are pre-auth and the obvious target for credential-stuffing or registration
// spam — a much tighter limit than the app-wide default, keyed per-IP by ThrottlerGuard.
const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 10 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post("logout")
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }
}
