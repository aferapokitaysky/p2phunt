import { Body, Controller, Get, Post } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator.js";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { AuthService } from "./auth.service.js";
import { LoginDto, RefreshDto, RegisterDto } from "./dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
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
